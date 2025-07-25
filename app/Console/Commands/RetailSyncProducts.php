<?php

namespace App\Console\Commands;

use App\Models\Product as ModelProduct;
use Google\Cloud\Retail\V2\Client\ProductServiceClient;
use Google\Cloud\Retail\V2\Product;
use Google\Cloud\Retail\V2\PriceInfo;
use Google\Cloud\Retail\V2\Product\Type as ProductType;
use Illuminate\Console\Command;
use Google\Cloud\Retail\V2\GetProductRequest;
use Google\Cloud\Retail\V2\UpdateProductRequest;
use Google\Protobuf\FieldMask;
use Illuminate\Support\Facades\Log;
use Google\Cloud\Retail\V2\CreateProductRequest;
use Google\Cloud\Retail\V2\Product\Availability;

class RetailSyncProducts extends Command
{
    protected $signature = 'app:retail-sync-products';
    protected $description = 'Sync products to GCP Vertex AI Search catalog';

    private $id, $location, $catalog, $branch;

    public function __construct()
    {
        parent::__construct();
        $this->id = config('services.gcp.project_id');
        $this->location = config('services.gcp.location');
        $this->catalog = config('services.gcp.catalog_id');
        $this->branch = config('services.gcp.branch_id');
    }

    public function handle()
    {
        try {
            $productServiceClient = new ProductServiceClient([
                'credentials' => storage_path('app/gcp/service-account.json')
            ]);


            $branchPath = $productServiceClient->branchName($this->id, $this->location, $this->catalog, $this->branch);

            $products = $this->getAllProducts();

            foreach ($products as $product) {
                $productId = (string) $product->id;

                $productObject = new Product([
                    'id' => $productId,
                    'title' => $product->name,
                    'type' => ProductType::PRIMARY,
                    'price_info' => new PriceInfo([
                        'price' => $product->price,
                        'currency_code' => 'VND',
                    ]),
                    'categories' => [$product->category->name ?? 'uncategorized'],
                    'availability' => $this->getProductStatus($product->status),
                    'brands' => [$product->brand ?? 'generic'],
                    'description' => $product->description,
                ]);

                $name = $productServiceClient->productName($this->id, $this->location, $this->catalog, $this->branch, $productId);

                $productObject->setName($name);

                try {
                    $request = new GetProductRequest([
                        'name' => $name
                    ]);

                    $existing = $productServiceClient->getProduct($request);

                    $fieldMask = new FieldMask([
                        'paths' => ['title', 'price_info', 'categories', 'availability', 'brands', 'description']
                    ]);

                    $updateRequest = new UpdateProductRequest([
                        'product' => $productObject,
                        'update_mask' => $fieldMask
                    ]);

                    $productServiceClient->updateProduct($updateRequest);
                    $this->info("Updated: {$product->name}");
                } catch (\Google\ApiCore\ApiException $e) {
                    // Nếu không tồn tại thì tạo mới
                    $createRequest = new CreateProductRequest([
                        'parent' => $branchPath,
                        'product_id' => $productId,
                        'product' => $productObject
                    ]);

                    $productServiceClient->createProduct($createRequest);
                    $this->info("Created: {$product->name}");
                }
            }
        } catch (\Exception $e) {
            Log::error($e);
        }
    }
    private function getAllProducts()
    {
        $products = ModelProduct::query()->withoutTrashed()->get();

        return $products;
    }

    private function getProductStatus($code)
    {
        $availability = Availability::OUT_OF_STOCK;

        switch ($code) {
            case 1:
                $availability = Availability::IN_STOCK;
                break;
            case 2:
                $availability = Availability::OUT_OF_STOCK;
                break;
            default:
                $availability = Availability::OUT_OF_STOCK;
                break;
        }

        return $availability;
    }
}
