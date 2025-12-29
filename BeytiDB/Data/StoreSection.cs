using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("StoreSection")]
[Index(nameof(SellerId))]
public partial class StoreSection
{
    [Key]
    public int Id { get; set; }

    public int SellerId { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    [ForeignKey(nameof(SellerId))]
    [InverseProperty("StoreSections")]
    public virtual Seller Seller { get; set; } = null!;

    [InverseProperty("StoreSection")]
    public virtual ICollection<Product> Products { get; set; }
        = new List<Product>();
}
