<?php

namespace App\Jobs;

use App\Models\Product as ModelProduct;
use Google\Cloud\Retail\V2\Client\ProductServiceClient;
use Google\Cloud\Retail\V2\Product;
use Google\Cloud\Retail\V2\PriceInfo;
use Google\Cloud\Retail\V2\Product\Type as ProductType;
use Google\Cloud\Retail\V2\GetProductRequest;
use Google\Cloud\Retail\V2\UpdateProductRequest;
use Google\Protobuf\FieldMask;
use Illuminate\Support\Facades\Log;
use Google\Cloud\Retail\V2\CreateProductRequest;
use Google\Cloud\Retail\V2\Product\Availability;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncProductGCP implements ShouldQueue
{
    use Queueable;

    private $id, $location, $catalog, $branch;
    private ModelProduct $product;

    public function __construct(ModelProduct $p)
    {
        $this->id = config('services.gcp.project_id');
        $this->location = config('services.gcp.location');
        $this->catalog = config('services.gcp.catalog_id');
        $this->branch = config('services.gcp.branch_id');
        $this->product = $p;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $productServiceClient = new ProductServiceClient([
                'credentials' => storage_path('app/gcp/service-account.json')
            ]);

            $branchPath = $productServiceClient->branchName($this->id, $this->location, $this->catalog, $this->branch);

            $productId = (string) $this->product->id;

            $productObject = new Product([
                'id' => $productId,
                'title' => $this->product->name,
                'type' => ProductType::PRIMARY,
                'price_info' => new PriceInfo([
                    'price' => $this->product->price,
                    'currency_code' => 'VND',
                ]),
                'categories' => [$product->category->name ?? 'uncategorized'],
                'availability' => $this->getProductStatus($this->product->status),
                'brands' => [$product->brand ?? 'generic'],
                'description' => $this->product->description,
            ]);

            try {
                $fieldMask = new FieldMask([
                    'paths' => ['title', 'price_info', 'categories', 'availability', 'brands', 'description']
                ]);

                $updateRequest = new UpdateProductRequest([
                    'product' => $productObject,
                    'update_mask' => $fieldMask
                ]);

                $productServiceClient->updateProduct($updateRequest);
            } catch (\Google\ApiCore\ApiException $e) {
                $createRequest = new CreateProductRequest([
                    'parent' => $branchPath,
                    'product_id' => $productId,
                    'product' => $productObject
                ]);

                $productServiceClient->createProduct($createRequest);
            }
        } catch (\Exception $e) {
            Log::error('Lỗi khi sync sản phẩm: ' . $e->getMessage());
        }
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
